import React, { useState, useEffect, useContext } from "react";
import useStyles from "./styles";
import { ExpenseTrackerContext } from "../../../context/context";
import { useSpeechContext } from "@speechly/react-client";
import formatDate from "../../../utils/formatDate";
import { v4 as uuidv4 } from "uuid";
import CustomizedSnackbar from "../../Snackbar/Snackbar";
import {
  incomeCategories,
  expenseCategories,
} from "../../../constants/categories";
import {
  TextField,
  Typography,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@material-ui/core";

const initialState = {
  amount: "",
  category: "",
  type: "Income",
  date: formatDate(new Date()),
};

const Form = () => {
  const classes = useStyles();
  const [formData, setFormData] = useState(initialState);
  const [open, setOpen] = useState(false);
  const { addTransaction } = useContext(ExpenseTrackerContext);
  const { segment } = useSpeechContext();
  const selected =
    formData.type === "Income" ? incomeCategories : expenseCategories;
  const createTransaction = () => {
    if (Number.isNaN(Number(formData.amount)) || !formData.date.includes("-"))
      return;
    addTransaction({ ...formData, id: uuidv4() });
    setOpen(true);
    setFormData(initialState);
  };

  useEffect(() => {
    if (segment) {
      if (segment.intent.intent === "add_expense") {
        setFormData({ ...formData, type: "Expense" });
      } else if (segment.intent.intent === "add_income") {
        setFormData({ ...formData, type: "Income" });
      } else if (
        segment.isFinal &&
        segment.intent.intent === "create_transaction"
      ) {
        return createTransaction();
      } else if (
        segment.isFinal &&
        segment.intent.intent === "cancel_transaction"
      ) {
        return setFormData(initialState);
      }
      segment.entities.forEach(({ type, value }) => {
        const category = `${value.charAt(0)}${value.slice(1).toLowerCase()}`;
        switch (type) {
          case "amount":
            setFormData({ ...formData, amount: value });
            break;
          case "category":
            if (incomeCategories.map(ic => ic.type).includes(category)) {
              setFormData({
                ...formData,
                type: "Income",
                category,
              });
            } else if (
              expenseCategories.map(ic => ic.type).includes(category)
            ) {
              setFormData({
                ...formData,
                type: "Expense",
                category,
              });
            }
            setFormData({
              ...formData,
              category,
            });
            break;
          case "date":
            setFormData({ ...formData, date: value });
            break;

          default:
            break;
        }
      });

      if (
        segment.isFinal &&
        formData.amount &&
        formData.category &&
        formData.date &&
        formData.type
      ) {
        createTransaction();
      }
    }
  }, [segment]);

  return (
    <Grid container spacing={12}>
      <CustomizedSnackbar open={open} setOpen={setOpen} />
      <Grid item xs={12}>
        <Typography align="center" variant="subtitle2" gutterBottom>
          {segment && <>{segment.words.map(w => w.value).join(" ")}</>}
        </Typography>
      </Grid>
      <Grid item xs={6}>
        <FormControl fullWidth>
          <InputLabel>Type</InputLabel>
          <Select
            value={formData.type}
            onChange={e => setFormData({ ...formData, type: e.target.value })}
          >
            <MenuItem value="Income">Income</MenuItem>
            <MenuItem value="Expense">Expense</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={6}>
        <FormControl fullWidth>
          <InputLabel>Categories</InputLabel>
          <Select
            value={formData.category}
            onChange={e =>
              setFormData({ ...formData, category: e.target.value })
            }
          >
            {selected.map(({ type }, i) => (
              <MenuItem value={type} key={i}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={6}>
        <TextField
          type="number"
          label="amount"
          fullWidth
          value={formData.amount}
          onChange={e => setFormData({ ...formData, amount: +e.target.value })}
        />
      </Grid>
      <Grid item xs={6}>
        <TextField
          type="date"
          label="Date"
          fullWidth
          value={formData.date}
          onChange={e =>
            setFormData({ ...formData, date: formatDate(e.target.value) })
          }
        />
      </Grid>
      <Button
        className={classes.button}
        variant="outlined"
        color="primary"
        fullWidth
        onClick={() => createTransaction()}
      >
        Create
      </Button>
    </Grid>
  );
};

export default Form;
